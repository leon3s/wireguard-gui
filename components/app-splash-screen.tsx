import Image from 'next/image';

export function AppSplashScreen() {
  return (
    <div className="bg-background fixed z-50 flex size-full items-center justify-center">
      <Image
        className="animate-pulse"
        alt="wireguard"
        src="/img/wireguard.png"
        width={200}
        height={200}
      />
    </div>
  );
}
