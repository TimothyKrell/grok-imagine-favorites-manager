/**
 * TypeScript types for uploaded asset files
 */

export interface AssetFile {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly createdAt: number;
  readonly lastUsedAt: number;
  readonly previewUrl?: string;
  readonly downloadUrl: string;
  readonly width?: number;
  readonly height?: number;
}

export interface AssetListResponse {
  readonly assets: readonly AssetFile[];
  readonly nextPageToken?: string;
  readonly hasMore: boolean;
}

export interface AssetListParams {
  readonly pageToken?: string;
  readonly pageSize?: number;
}

export interface AssetThumbnailProps {
  readonly asset: AssetFile;
  readonly isSelected: boolean;
  readonly onToggleSelect: (assetId: string, shiftKey?: boolean) => void;
}

export interface AssetBulkActionsProps {
  readonly selectedCount: number;
  readonly onDelete: () => void;
  readonly onDeselectAll: () => void;
  readonly isProcessing: boolean;
  readonly deleteProgress?: string;
}
