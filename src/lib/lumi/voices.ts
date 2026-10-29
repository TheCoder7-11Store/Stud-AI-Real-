export const LUMI_VOICES = [
  { id: "en-US", label: "English · American", language: "English", accent: "American English" },
  { id: "en-GB", label: "English · British", language: "English", accent: "British English" },
  { id: "en-AU", label: "English · Australian", language: "English", accent: "Australian English" },
  { id: "en-IN", label: "English · Indian", language: "English", accent: "Indian English" },
  { id: "es-ES", label: "Español", language: "Spanish", accent: "Spanish from Spain" },
  { id: "fr-FR", label: "Français", language: "French", accent: "French from France" },
  { id: "hi-IN", label: "हिन्दी", language: "Hindi", accent: "Hindi from India" },
] as const;
export function resolveVoice(id: string) {
  return LUMI_VOICES.find(v => v.id === id) ?? LUMI_VOICES[0];
}
export const VOICE_PREFERENCE_KEY = "studai.lumi-language";