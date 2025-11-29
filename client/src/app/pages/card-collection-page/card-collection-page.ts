import { Component, inject, OnInit, signal } from '@angular/core';
import { NftCard, NftCardsService } from '../../core/services/nft-cards-service/nft-cards-service';
import { CardType } from '../../core/models/card-type';
import { CardHelperService } from '../../core/services/card-helper-service/card-helper-service';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-card-collection-page',
  imports: [
    MatCard,
    MatProgressSpinner
  ],
  templateUrl: './card-collection-page.html',
  styleUrl: './card-collection-page.scss',
})
export class CardCollectionPage implements OnInit {
  private nftCardsService = inject(NftCardsService);
  private cardHelper = inject(CardHelperService);

  nftCards = signal<NftCard[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadNfts();
  }

  private loadNfts() {
    this.isLoading.set(true);

    this.nftCardsService.getNftCardsCollection().subscribe({
      next: (nfts) => {
        this.nftCards.set(nfts);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load collection:', err);
        this.isLoading.set(false);
      }
    });
  }

  getCardImagePath(card: NftCard): string {
    return this.cardHelper.getImagePathFromNftCard(card);
  }

  getCardValue(card: NftCard): string {
    switch (card.cardType) {
      case CardType.OneOrTwoPlusMinus:   return "1&2";
      case CardType.ThreeOrFourPlusMinus: return "3&4";
      case CardType.FiveOrSixPlusMinus:  return "5&6";
      default:
        const match = card.cardType.toString().match(/(\d+)$/);
        return match ? `±${match[0]}` : '?';
    }
  }

  getSolscanUrl(mintAddress: string): string {
    return `https://solscan.io/token/${mintAddress}?cluster=devnet`;
  }

  onCardClick(card: NftCard) {
    console.log('Card clicked:', card);
  }
}
