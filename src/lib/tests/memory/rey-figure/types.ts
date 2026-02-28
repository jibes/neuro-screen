export interface ReyElement {
	id: number;
	label: string;
	svgPath: string;
	isReal: boolean;
}

export interface ReyElementResponse {
	elementId: number;
	isReal: boolean;
	userSaidYes: boolean;
	correct: boolean;
	rt: number;
}
