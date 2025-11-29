import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CardType } from '../../models/card-type';

export interface DasSearchAssetsRequest {
  jsonrpc: '2.0';
  id: number;
  method: 'searchAssets';
  params: {
    grouping: ['collection', string];
    ownerAddress: string;
    page?: number;
    limit?: number;
    burnt?: boolean;
  };
}

export interface DasAsset {
  id: string;
  interface: string;
  content: {
    json_uri: string;
    metadata: {
      attributes: Array<{
        value: CardType;
        trait_type: string;
      }>;
      description: string;
      name: string;
      symbol: string;
      token_standard: string;
    };
    files?: Array<{
      uri: string;
      mime: string;
    }>;
    links?: {
      image?: string;
      external_url?: string;
    };
    category: string;
  };
  authorities?: Array<{
    address: string;
    scopes: string[];
  }>;
  compression?: {
    compressed: boolean;
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
}

export interface NftCard {
  id: string;
  cardType: CardType;
  name: string;
  description: string;
  symbol: string;
}

export interface DasSearchAssetsResponse {
  jsonrpc: '2.0';
  id: number;
  result: {
    total: number;
    limit: number;
    page: number;
    items: DasAsset[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class NftCardsService {
  private readonly http = inject(HttpClient);
  private readonly rpcUrl = 'https://api.devnet.solana.com';
  private readonly ownerAddress = '3Y89vAQJyGbH2NrGMxocyPsCDHs2NsJihdnrV9zdZKcq';
  private readonly collectionAddress = 'GZPjAZnG5LmZAmpKrpBZmidAM4KsqCAzp8h5FCJNSgUL';

  getNftCardsCollection(): Observable<NftCard[]> {
    const payload: DasSearchAssetsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'searchAssets',
      params: {
        grouping: ['collection', this.collectionAddress],
        ownerAddress: this.ownerAddress,
        limit: 100,
        burnt: false,
      }
    };

    return this.http.post<DasSearchAssetsResponse>(this.rpcUrl, payload)
      .pipe(
        map(response => response.result.items.map(x => {
          const nftCard: NftCard = {
            id: x.id,
            cardType: x.content.metadata.attributes[0].value,
            name: x.content.metadata.name,
            description: x.content.metadata.description,
            symbol: x.content.metadata.symbol,
          }
          return nftCard;
        })),
      );
  }
}
