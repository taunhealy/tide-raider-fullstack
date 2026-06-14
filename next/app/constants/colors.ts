export interface BadgeColor {
  bg: string;
  text: string;
  border: string;
  label: string;
}

export const CATEGORY_COLORS: Record<string, BadgeColor> = {
  FOILING:    { bg: "bg-brand-blue-medium/10",  text: "text-brand-blue-medium",  border: "border-brand-blue-medium/20",  label: "Foiling" },
  KITESURFING:{ bg: "bg-brand-blue-primary/10", text: "text-brand-blue-primary", border: "border-brand-blue-primary/20", label: "Kitesurfing" },
  SURFING:    { bg: "bg-brand-blue-dark/10",    text: "text-brand-blue-dark",    border: "border-brand-blue-dark/20",    label: "Surfing" },
};

export const SOURCE_COLORS: Record<string, BadgeColor> = {
  WINDY:             { bg: "bg-brand-blue-dark/10",    text: "text-brand-blue-dark",   border: "border-brand-blue-dark/20",   label: "Windy" },
  WINDGURU:          { bg: "bg-brand-blue-primary/10", text: "text-brand-blue-primary", border: "border-brand-blue-primary/20", label: "Guru" },
  WINDFINDER_SUPER:  { bg: "bg-brand-blue-medium/10",  text: "text-brand-blue-medium",  border: "border-brand-blue-medium/20",  label: "Super" },
  WINDFINDER:        { bg: "bg-brand-blue-light/10",   text: "text-brand-blue-light",   border: "border-brand-blue-light/20",   label: "Finder" },
  TIDE_RAIDER:       { bg: "bg-brand-blue-muted/20",   text: "text-slate-700",          border: "border-brand-blue-muted/30",   label: "Raider" }
};
