export type TemplateId =
  | 'template_rock01'
  | 'template_jazz01'
  | 'template_dnb01'
  | 'template_hiphop01';

export type PadCategory =
  | 'drum'
  | 'bass'
  | 'melodic'
  | 'fx'
  | 'perc'
  | 'vocal';

export type PadColor =
  | 'green'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'indigo'
  | 'teal'
  | 'red'
  | 'yellow';

export type Mode = 'pad' | 'filter' | 'volume' | 'fx';
export type PadVisualState = 'idle' | 'pressed' | 'active' | 'empty';

export interface PadDefinition {
  id: string;
  row: number;
  column: number;
  label: string;
  category: PadCategory;
  color: PadColor;
  sample?: string;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  accentColor: string;
  pads: PadDefinition[];
}

export interface TemplateDocument {
  version: 1;
  templates: TemplateDefinition[];
}
