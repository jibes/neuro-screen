export type StimulusType = 'go' | 'nogo';

export interface GoNoGoTrial {
	type: StimulusType;
	color: string;
}
