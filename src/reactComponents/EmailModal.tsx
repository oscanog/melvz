import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { isEmailModalVisibleAtom, emailAtom } from "../store";

interface ButtonConfig {
  id: number;
  name: string;
  handler: () => void;
}

export default function EmailModal(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useAtom(isEmailModalVisibleAtom);
  const email = useAtomValue(emailAtom);
  const [onCopyMessage, setOnCopyMessage] = useState<string>("");

  const buttons: ButtonConfig[] = [
    {
      id: 0,
      name: "Yes",
      handler: () => {
        navigator.clipboard.writeText(email);
        setOnCopyMessage("Email copied to clipboard!");
      },
    },
    {
      id: 1,
      name: "No",
      handler: () => {
        setIsVisible(false);
      },
    },
  ];

  if (!isVisible) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h1>Copy my email to your clipboard?</h1>
        <span>{email}</span>
        <p>{onCopyMessage}</p>
        <div className="modal-btn-container">
          {buttons.map((button) => (
            <button
              key={button.id}
              className="modal-btn"
              onClick={button.handler}
            >
              {button.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
