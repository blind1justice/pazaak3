use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GameConfig {
    pub config_authority: Pubkey,
    pub game_authority: Pubkey,
    pub token_mint: Pubkey,
    pub token_treasury: Pubkey,
    #[max_len(8)] // u64
    pub token_minimal_bid: u64,
    pub token_fee: u8
}
