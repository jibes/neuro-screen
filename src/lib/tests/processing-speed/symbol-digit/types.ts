export interface SymbolMapping {
	symbol: string;
	digit: number;
}

export interface SymbolDigitTrial {
	symbolIndex: number;
	correctDigit: number;
	trialNumber: number;
}

export interface SymbolDigitResult {
	trial: SymbolDigitTrial;
	userResponse: number | null;
	correct: boolean;
	rt: number;
}
