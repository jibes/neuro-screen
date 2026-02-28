export type WCSTColor = 'rot' | 'blau' | 'gruen' | 'gelb';
export type WCSTShape = 'kreis' | 'dreieck' | 'stern' | 'kreuz';
export type WCSTRule = 'color' | 'shape' | 'number';

export interface WCSTCard {
	color: WCSTColor;
	shape: WCSTShape;
	count: number;
}

export interface WCSTTrialResult {
	testCard: WCSTCard;
	selectedRefIndex: number;
	currentRule: WCSTRule;
	matchedDimensions: WCSTRule[];
	correct: boolean;
	isPerseverative: boolean;
	trialNumber: number;
	rt: number;
}
