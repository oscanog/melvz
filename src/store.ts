import { atom, createStore, type PrimitiveAtom } from "jotai";

export interface ProjectLink {
  id: number;
  name: string;
  link: string;
}

export interface ProjectData {
  title: string;
  links: ProjectLink[];
}

export interface CameraZoomValue {
  value: number;
}

export const isSocialModalVisibleAtom: PrimitiveAtom<boolean> = atom(false);
export const selectedLinkAtom = atom<string | null>(null);
export const selectedLinkDescriptionAtom: PrimitiveAtom<string> = atom("");

export const isEmailModalVisibleAtom: PrimitiveAtom<boolean> = atom(false);
export const emailAtom: PrimitiveAtom<string> = atom("");

export const isProjectModalVisibleAtom: PrimitiveAtom<boolean> = atom(false);
export const chosenProjectDataAtom: PrimitiveAtom<ProjectData> = atom({
  title: "",
  links: [{ id: 0, name: "", link: "" }],
});

export const cameraZoomValueAtom: PrimitiveAtom<CameraZoomValue> = atom({ value: 1 });

export const store = createStore();
