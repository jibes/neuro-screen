export type StroopCondition = 'congruent' | 'incongruent' | 'neutral';
export type StroopColor = 'rot' | 'blau' | 'gruen' | 'gelb';

export interface StroopTrial {
	condition: StroopCondition;
	word: string;
	inkColor: StroopColor;
	correctKey: string;
}
