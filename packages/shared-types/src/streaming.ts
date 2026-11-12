export interface StreamingStatusDto {
  ndiActive: boolean;
  ndiStreamName: string;
  diskExportActive: boolean;
  diskExportPath: string;
  lastFrameTimestamp: number;
}

export interface NdiConfigDto {
  enabled: boolean;
  streamName: string;
  includeAlpha: boolean;
  frameRate: 30 | 60;
}

export interface DiskExportConfigDto {
  enabled: boolean;
  outputDirectory: string;
  exportPng: boolean;
  exportXml: boolean;
}

