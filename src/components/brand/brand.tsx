import { Link } from "react-router-dom";
import { arkaLogo, arkaMark } from "../../assets/index.ts";
import { ROUTES } from "../../constants/routes.ts";

interface BrandProps {
  compact?: boolean;
  transparentMark?: boolean;
}

export function Brand({ compact = false, transparentMark = false }: BrandProps) {
  return (
    <Link
      aria-label="Arka, kembali ke halaman utama"
      className="inline-flex min-h-12 w-fit items-center gap-2 no-underline"
      to={ROUTES.landing}
    >
      <img
        alt=""
        aria-hidden
        className="size-11 rounded-full object-cover"
        src={transparentMark ? arkaLogo : arkaMark}
      />
      <span className="brand-wordmark text-2xl font-bold tracking-[-0.04em]">
        ARKA
      </span>
      {!compact && (
        <span className="ml-1 hidden text-base font-extrabold tracking-[0.08em] text-muted uppercase sm:block">
          Latihan terpandu
        </span>
      )}
    </Link>
  );
}
