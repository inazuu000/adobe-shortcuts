import type { Command, Software, SoftwareInfo, Tool } from './types';
import { photoshopTools } from './tools-ps';
import { illustratorTools } from './tools-ai';
import { photoshopCommands } from './commands-ps';
import { illustratorCommands } from './commands-ai';

export * from './types';

export const SOFTWARE: Record<Software, SoftwareInfo> = {
  photoshop: {
    id: 'photoshop',
    name: 'Adobe Photoshop',
    short: 'Photoshop',
    blurb: 'Learn Photoshop tools, understand their functions, memorize shortcuts, and practice essential editing commands.',
    toolCategories: [
      'Selection and Artboard Tools', 'Crop and Slice Tools', 'Measurement Tools', 'Retouching Tools',
      'Painting Tools', 'Type Tools', 'Vector Drawing Tools', 'Navigation Tools', 'Other Toolbar Buttons',
    ],
    commandCategories: [
      'Selection Commands', 'Editing Commands', 'Layers', 'Files and Documents', 'Transformations',
      'Visibility and Guides', 'View and Navigation', 'Workflow and Productivity',
    ],
    referenceImage: 'reference/PHOTOSHOP.jpg',
    homeVisual: 'reference/ps-icon-grid.png',
    version: 'Photoshop 2024–2026',
  },
  illustrator: {
    id: 'illustrator',
    name: 'Adobe Illustrator',
    short: 'Illustrator',
    blurb: 'Learn Illustrator tools, understand their functions, memorize shortcuts, and practice essential vector-design commands.',
    toolCategories: [
      'Selection Tools', 'Type Tools', 'Reshaping Tools', 'Symbol Tools', 'Drawing Tools',
      'Painting Tools', 'Graph Tools', 'Slicing and Cutting Tools', 'Moving and Zooming Tools',
    ],
    commandCategories: [
      'Selection', 'Editing', 'Grouping', 'Arrangement', 'Object Management', 'Files and Documents',
      'View and Navigation', 'Productivity',
    ],
    referenceImage: 'reference/ILLUSTRATOR.jpg',
    homeVisual: 'reference/ai-toolbar-panel.png',
    version: 'Illustrator 2024–2026',
  },
};

/** Tools and commands are deliberately separate collections. */
export const TOOLS: Record<Software, Tool[]> = {
  photoshop: photoshopTools,
  illustrator: illustratorTools,
};
export const COMMANDS: Record<Software, Command[]> = {
  photoshop: photoshopCommands,
  illustrator: illustratorCommands,
};

export function isSoftware(v: string | undefined): v is Software {
  return v === 'photoshop' || v === 'illustrator';
}

export function toolById(sw: Software, id: string): Tool | undefined {
  return TOOLS[sw].find((t) => t.id === id);
}
export function commandById(sw: Software, id: string): Command | undefined {
  return COMMANDS[sw].find((c) => c.id === id);
}

/** Other tools that share the same default key within the same app. */
export function sharedKeyTools(tool: Tool): Tool[] {
  if (!tool.win) return [];
  return TOOLS[tool.software].filter((t) => t.id !== tool.id && t.win === tool.win);
}
