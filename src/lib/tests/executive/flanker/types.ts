export type FlankerCondition = 'congruent' | 'incongruent';
export type FlankerDirection = 'left' | 'right';

export interface FlankerTrial {
	condition: FlankerCondition;
	targetDirection: FlankerDirection;
	display: string; // e.g. "<<<<<" or ">><>>"
}
