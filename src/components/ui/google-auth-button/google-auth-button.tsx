import { Button } from '../button/button.tsx';
import { GoogleIcon } from '../google-icon/google-icon.tsx';

interface GoogleAuthButtonProps {
  disabled: boolean;
  label: string;
  loadingLabel: string;
  loading: boolean;
  onClick: () => void;
}

export function GoogleAuthButton({
  disabled,
  label,
  loading,
  loadingLabel,
  onClick,
}: GoogleAuthButtonProps) {
  return (
    <Button
      aria-disabled={disabled}
      className="w-full"
      disabled={disabled}
      onClick={onClick}
      variant="secondary"
    >
      <GoogleIcon />
      {loading ? loadingLabel : label}
    </Button>
  );
}
