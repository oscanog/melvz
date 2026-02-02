import { useAtomValue, useAtom } from "jotai";
import { isProjectModalVisibleAtom, chosenProjectDataAtom, type ProjectLink } from "../store";

export default function ProjectModal(): React.ReactElement | null {
  const projectData = useAtomValue(chosenProjectDataAtom);
  const [isVisible, setIsVisible] = useAtom(isProjectModalVisibleAtom);

  if (!isVisible) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h1>{projectData.title}</h1>
        <div className="modal-btn-container">
          {projectData.links.map((linkData: ProjectLink) => (
            <button
              key={linkData.id}
              className="modal-btn"
              onClick={() => {
                window.open(linkData.link, "_blank");
              }}
            >
              {linkData.name}
            </button>
          ))}
          <button
            className="modal-btn"
            onClick={() => {
              setIsVisible(false);
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
