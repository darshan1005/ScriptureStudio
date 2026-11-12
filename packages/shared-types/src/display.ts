export type DisplayRole = 'CONTROL' | 'AUDIENCE' | 'STAGE' | 'UNASSIGNED';

export interface DisplayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DisplayDto {
  id: string;                    // OS display ID as string
  name: string;                  // e.g. "EPSON Projector" or "Generic PnP Monitor"
  bounds: DisplayBounds;
  workArea: DisplayBounds;
  isPrimary: boolean;
  scaleFactor: number;
  role: DisplayRole;
}

export interface DisplayTopologyEvent {
  connectedCount: number;
  displays: DisplayDto[];
  hasAudienceDisplay: boolean;
  hasStageDisplay: boolean;
}

