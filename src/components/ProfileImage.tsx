import { useEffect, useState } from "react";

interface ProfileImageProps {
  src: string;
  alt: string;
  blurSrc?: string;
  className?: string;
  defer?: boolean;
}

export function ProfileImage({
  src,
  alt,
  blurSrc,
  className = "",
  defer = false,
}: ProfileImageProps): React.ReactElement {
  const [loaded, setLoaded] = useState(false);
  const visibleSrc = defer ? "" : src;
  const backgroundStyle = blurSrc
    ? { backgroundImage: `url("${blurSrc}")` }
    : undefined;

  useEffect(() => {
    setLoaded(false);
    if (!visibleSrc) return;

    let active = true;
    const image = new Image();
    image.onload = () => {
      if (active) setLoaded(true);
    };
    image.onerror = () => {
      if (active) setLoaded(true);
    };
    image.src = visibleSrc;

    if (image.complete && image.naturalWidth > 0) {
      setLoaded(true);
    }

    return () => {
      active = false;
    };
  }, [visibleSrc]);

  return (
    <span
      className={[
        "profile-image-shell",
        blurSrc ? "profile-image-shell--has-blur" : "",
        loaded ? "profile-image-shell--loaded" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={backgroundStyle}
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
          onError={() => setLoaded(true)}
        />
      ) : null}
    </span>
  );
}
