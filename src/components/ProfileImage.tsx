import { useEffect, useState } from "react";

interface ProfileImageProps {
  src: string;
  alt: string;
  className?: string;
  defer?: boolean;
}

export function ProfileImage({
  src,
  alt,
  className = "",
  defer = false,
}: ProfileImageProps): React.ReactElement {
  const [loaded, setLoaded] = useState(false);
  const visibleSrc = defer ? "" : src;

  useEffect(() => {
    setLoaded(false);
  }, [visibleSrc]);

  return (
    <span
      className={[
        "profile-image-shell",
        loaded ? "profile-image-shell--loaded" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-busy={visibleSrc && !loaded ? "true" : "false"}
    >
      {visibleSrc ? (
        <img
          key={visibleSrc}
          src={visibleSrc}
          alt={alt}
          className="rp-photo__img"
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
        />
      ) : null}
    </span>
  );
}
