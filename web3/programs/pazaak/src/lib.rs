use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use orao_solana_vrf::{self, state::NetworkState};

pub mod states;
use states::{
    game_config::GameConfig, game_room::BusyGameRoom, game_room::CreatedGameRoom,
    game_room::FinishedGameRoom, game_room::GameRoom, game_room::GameRoomState,
    game_room::WinnerSide,
};

declare_id!("HGXYnpJBx4U3vbBY4UgrkkWYqyy7mVqAbnaby3sJuLFQ");

pub const GAME_ROOM_SEED: &[u8] = b"pazaak-room";
pub const GAME_CONFIG_SEED: &[u8] = b"pazaak-config";
pub const ROOM_TREASURY_SEED: &[u8] = b"pazaak-room-treasury";

#[program]
pub mod pazaak {
    use super::*;

    pub fn initialize_game_config(
        ctx: Context<InitializeGameConfig>,
        game_authority: Pubkey,
        token_minimal_bid: u64,
        token_fee: u8,
    ) -> Result<()> {
        require!(token_minimal_bid > 0, PazaakError::InvalidMinimalBid);

        let config = &mut ctx.accounts.config;
        config.config_authority = ctx.accounts.config_authority.key();
        config.game_authority = game_authority;
        config.token_mint = ctx.accounts.token_mint.key();
        config.token_treasury = ctx.accounts.token_treasury.key();
        config.token_minimal_bid = token_minimal_bid;
        config.token_fee = token_fee;
        Ok(())
    }

    pub fn create_game_room(
        ctx: Context<CreateGameRoom>,
        room_id: u64,
        token_bid: u64,
        cards_permutation_hash: [u8; 32],
    ) -> Result<()> {
        require!(
            token_bid >= ctx.accounts.config.token_minimal_bid,
            PazaakError::BidTooSmall
        );

        let game_room = &mut ctx.accounts.game_room;
        game_room.state = GameRoomState::Created(CreatedGameRoom {
            player1: ctx.accounts.player.key(),
            token_bid,
            cards_permutation_hash,
        });

        // Перевод токенов
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.player_token_account.to_account_info(),
            to: ctx.accounts.room_treasury.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, token_bid)?;

        msg!("Game room #{} created", room_id);
        Ok(())
    }

    pub fn enter_game_room(
        ctx: Context<EnterGameRoom>,
        room_id: u64,
        vrf_seed: [u8; 32],
    ) -> Result<()> {

        let (player1, token_bid, cards_hash) = match &ctx.accounts.game_room.state {
            GameRoomState::Created(created) => (
                created.player1,
                created.token_bid,
                created.cards_permutation_hash,
            ),
            _ => return err!(PazaakError::RoomNotJoinable),
        };

        require_keys_neq!(player1, ctx.accounts.player.key(), PazaakError::SamePlayer);

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.player_token_account.to_account_info(),
            to: ctx.accounts.room_treasury.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, token_bid)?;

        // Отправляем запрос в ORAO VRF
        let vrf_program = ctx.accounts.vrf_program.to_account_info();
        let vrf_accounts = orao_solana_vrf::cpi::accounts::RequestV2 {
            payer: ctx.accounts.player.to_account_info(),
            network_state: ctx.accounts.vrf_network_state.to_account_info(),
            treasury: ctx.accounts.vrf_treasury.to_account_info(),
            request: ctx.accounts.vrf_request.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        let vrf_ctx = CpiContext::new(vrf_program, vrf_accounts);
        orao_solana_vrf::cpi::request_v2(vrf_ctx, vrf_seed)?;

        ctx.accounts.game_room.state = GameRoomState::Busy(BusyGameRoom {
            player1,
            player2: ctx.accounts.player.key(),
            token_bid,
            cards_permutation_hash: cards_hash,
            vrf_seed,
        });

        msg!(
            "Player {:?} entered room #{}",
            ctx.accounts.player.key(),
            room_id
        );
        Ok(())
    }

    pub fn finish_game(
        ctx: Context<FinishGame>,
        room_id: u64,
        winner_side: WinnerSide,
        canceled: bool,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let game_room = &mut ctx.accounts.game_room;

        let game_room_bump = ctx.bumps.game_room;

        let seeds: &[&[u8]] = &[GAME_ROOM_SEED, &room_id.to_le_bytes(), &[game_room_bump]];
        let signer_seeds = [seeds];

        // Busy
        let busy: BusyGameRoom = match &game_room.state {
            GameRoomState::Busy(b) => b.clone(),
            _ => return err!(PazaakError::GameNotFinishable),
        };

        // Общий пул = 2 * ставка
        let total_pool = busy
            .token_bid
            .checked_mul(2)
            .ok_or(PazaakError::MathOverflow)?;

        let fee = total_pool
            .checked_mul(config.token_fee as u64)
            .ok_or(PazaakError::MathOverflow)?
            .checked_div(100)
            .ok_or(PazaakError::MathOverflow)?;

        let remaining = total_pool
            .checked_sub(fee)
            .ok_or(PazaakError::MathOverflow)?;

        // Комиссия в токен-казну
        let cpi_accounts = Transfer {
            from: ctx.accounts.room_treasury.to_account_info(),
            to: ctx.accounts.token_treasury.to_account_info(),
            authority: game_room.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            &signer_seeds,
        );
        token::transfer(cpi_ctx, fee)?;

        if canceled {
            require!(
                winner_side == WinnerSide::None,
                PazaakError::InvalidWinnerForCancel
            );

            require_keys_eq!(
                ctx.accounts.player1_token_account.owner,
                busy.player1,
                PazaakError::InvalidPlayerAccount
            );
            require_keys_eq!(
                ctx.accounts.player2_token_account.owner,
                busy.player2,
                PazaakError::InvalidPlayerAccount
            );

            let half = remaining.checked_div(2).ok_or(PazaakError::MathOverflow)?;

            let cpi_accounts = Transfer {
                from: ctx.accounts.room_treasury.to_account_info(),
                to: ctx.accounts.player1_token_account.to_account_info(),
                authority: game_room.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                &signer_seeds,
            );
            token::transfer(cpi_ctx, half)?;

            let cpi_accounts = Transfer {
                from: ctx.accounts.room_treasury.to_account_info(),
                to: ctx.accounts.player2_token_account.to_account_info(),
                authority: game_room.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                &signer_seeds,
            );
            token::transfer(cpi_ctx, half)?;

            game_room.state = GameRoomState::Finished(FinishedGameRoom {
                player1: busy.player1,
                token_bid: busy.token_bid,
                cards_permutation_hash: busy.cards_permutation_hash,
                player2: busy.player2,
                vrf_seed: busy.vrf_seed,
                winner: WinnerSide::None,
                canceled: true,
            });

            return Ok(());
        }

        // завершение с победителем
        let winner_token_account_info = match winner_side {
            WinnerSide::Player1 => ctx.accounts.player1_token_account.to_account_info(),
            WinnerSide::Player2 => ctx.accounts.player2_token_account.to_account_info(),
            WinnerSide::None => return err!(PazaakError::NoWinner),
        };

        let cpi_accounts = Transfer {
            from: ctx.accounts.room_treasury.to_account_info(),
            to: winner_token_account_info,
            authority: game_room.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            &signer_seeds,
        );
        token::transfer(cpi_ctx, remaining)?;

        game_room.state = GameRoomState::Finished(FinishedGameRoom {
            player1: busy.player1,
            token_bid: busy.token_bid,
            cards_permutation_hash: busy.cards_permutation_hash,
            player2: busy.player2,
            vrf_seed: busy.vrf_seed,
            winner: winner_side,
            canceled: false,
        });

        Ok(())
    }
}

// =============================================
// == Accounts
// =============================================

#[derive(Accounts)]
#[instruction(room_id: u64)]
pub struct FinishGame<'info> {
    #[account(
        seeds = [GAME_CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [GAME_ROOM_SEED, room_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub game_room: Account<'info, GameRoom>,

    #[account(
        mut,
        seeds = [ROOM_TREASURY_SEED, room_id.to_le_bytes().as_ref()],
        bump,
        token::mint = config.token_mint,
        token::authority = game_room,
    )]
    pub room_treasury: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = config.token_treasury
    )]
    pub token_treasury: Account<'info, TokenAccount>,

    #[account(mut)]
    pub player1_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub player2_token_account: Account<'info, TokenAccount>,

    /// CHECK:
    #[account(
        signer, 
        address = config.game_authority
    )]
    pub game_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InitializeGameConfig<'info> {
    #[account(mut)]
    pub config_authority: Signer<'info>,
    /// CHECK:
    pub game_authority: UncheckedAccount<'info>,
    #[account(
        init,
        payer = config_authority,
        space = 8 + GameConfig::INIT_SPACE,
        seeds = [GAME_CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, GameConfig>,
    pub token_mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = token_treasury.mint == token_mint.key() @ PazaakError::InvalidTreasuryMint
    )]
    pub token_treasury: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: u64)]
pub struct CreateGameRoom<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        seeds = [GAME_CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, GameConfig>,
    #[account(
        init,
        payer = player,
        space = 8 + GameRoom::INIT_SPACE,
        seeds = [GAME_ROOM_SEED, room_id.to_le_bytes().as_ref()],
        bump
    )]
    pub game_room: Account<'info, GameRoom>,
    #[account(
        init,
        payer = player,
        seeds = [ROOM_TREASURY_SEED, room_id.to_le_bytes().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = game_room
    )]
    pub room_treasury: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = config.token_mint,
        associated_token::authority = player
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    #[account(
        address = config.token_mint
    )]
    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: u64, vrf_seed: [u8; 32])]
pub struct EnterGameRoom<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        seeds = [GAME_CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, GameConfig>,
    #[account(
        mut,
        seeds = [GAME_ROOM_SEED, room_id.to_le_bytes().as_ref()],
        bump
    )]
    pub game_room: Account<'info, GameRoom>,
    #[account(
        mut,
        seeds = [ROOM_TREASURY_SEED, room_id.to_le_bytes().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = game_room
    )]
    pub room_treasury: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = player
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    #[account(address = config.token_mint)]
    pub token_mint: Account<'info, Mint>,

    // VRF accounts
    /// CHECK: Account controlled by ORAO VRF program, seeds validated below
    #[account(
        mut,
        seeds = [orao_solana_vrf::RANDOMNESS_ACCOUNT_SEED, &vrf_seed],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    pub vrf_request: AccountInfo<'info>,
    /// CHECK: Treasury controlled by ORAO VRF network
    #[account(mut)]
    pub vrf_treasury: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [orao_solana_vrf::CONFIG_ACCOUNT_SEED],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    pub vrf_network_state: Account<'info, NetworkState>,
    pub vrf_program: Program<'info, orao_solana_vrf::program::OraoVrf>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// =============================================
// == Errors
// =============================================

#[error_code]
pub enum PazaakError {
    #[msg("Bid is smaller than minimal required bid")]
    BidTooSmall,
    #[msg("Minimal bid must be greater than zero")]
    InvalidMinimalBid,
    #[msg("Token treasury mint mismatch")]
    InvalidTreasuryMint,
    #[msg("Game room is not available to join")]
    RoomNotJoinable,
    #[msg("Same player cannot join twice")]
    SamePlayer,
    #[msg("Game room is not in a finishable state")]
    GameNotFinishable,
    #[msg("No winner specified")]
    NoWinner,
    #[msg("Invalid winner for canceled game")]
    InvalidWinnerForCancel,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid winner token account owner")]
    InvalidWinnerAccount,
    #[msg("Invalid player token account owner")]
    InvalidPlayerAccount,
    #[msg("Missing bump for PDA")]
    MissingBump,
}
