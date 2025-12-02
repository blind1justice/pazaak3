import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface TokenAccount {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
  address: string;
  isNative?: boolean;
}

export interface DasGetAssetResponse {
  jsonrpc: '2.0';
  id: number;
  result: {
    interface: 'V1_FUNGIBLE_TOKEN' | 'V1_NFT' | 'ProgrammableNFT' | string;
    id: string;
    content?: {
      metadata?: {
        name?: string;
        symbol?: string;
      };
      files?: Array<{ uri?: string }>;
      links?: { image?: string };
    };
    token_info?: {
      symbol?: string;
      balance?: number;
      supply?: string;
      decimals?: number;
      token_program?: string;
      price_info?: {
        price_per_token?: number;
        total_price?: number;
        currency?: string;
      };
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class SolanaApiService {
  private readonly http = inject(HttpClient);
  private readonly rpcUrl = 'https://api.devnet.solana.com';

  getAllTokens(ownerAddress: string): Observable<TokenAccount[]> {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'searchAssets',
      params: {
        ownerAddress,
        tokenType: 'fungible',
        limit: 1000,
        page: 1,
        displayOptions: {
          showFungible: true,
        },
      },
    };

    return this.http.post<any>(this.rpcUrl, payload).pipe(
      map(response => {
        const items = response.result?.items || [];

        return items.map((item: any): TokenAccount => {
          const tokenInfo = item.token_info || {};
          const content = item.content || {};
          const metadata = content.metadata || {};

          return {
            mint: item.id,
            address: item.id,
            amount: tokenInfo.balance?.toString() || '0',
            decimals: tokenInfo.decimals || 0,
            uiAmount: tokenInfo.balance ? tokenInfo.balance / Math.pow(10, tokenInfo.decimals || 0) : 0,
            symbol: tokenInfo.symbol || metadata.symbol || 'UNKNOWN',
            name: metadata.name || 'Unknown Token',
            logoURI: content.links?.image || content.files?.[0]?.uri || null,
            isNative: item.id === 'So11111111111111111111111111111111111111112',
          };
        });
      })
    );
  }
}
