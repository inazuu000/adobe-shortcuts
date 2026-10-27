export type Software = 'photoshop' | 'illustrator';
export type OS = 'windows' | 'mac';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Status = 'verified' | 'unverified';

export interface Tool {
  id: string; // also the icon file name (without extension)
  software: Software;
  category: string;
  name: string;
  aliases: string[];
  /** null = no dedicated default shortcut */
  win: string | null;
  mac: string | null;
  /** extra accepted key spellings, per OS */
  winAlt?: string[];
  macAlt?: string[];
  description: string; // short, shown on cards
  fn: string; // function text, shown in the exam (must not reveal the name)
  example: string;
  tip: string;
  icon: string; // path relative to site root, cropped from the uploaded reference image
  level: Level;
  status: Status;
  version: string;
  note?: string;
}

export interface Command {
  id: string;
  software: Software;
  category: string;
  name: string;
  aliases: string[];
  win: string;
  mac: string;
  winAlt?: string[];
  macAlt?: string[];
  description: string; // function text, shown in the exam (must not reveal the name)
  whenToUse: string;
  example: string;
  level: Level;
  status: Status;
  version: string;
  note?: string;
}

export interface SoftwareInfo {
  id: Software;
  name: string;
  short: string;
  blurb: string;
  toolCategories: string[];
  commandCategories: string[];
  referenceImage: string;
  homeVisual: string;
  version: string;
}

export const NO_SHORTCUT_LABEL = 'No dedicated default shortcut';
