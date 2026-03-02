type TransmitLayoutProps = {
  children: React.ReactNode;
};

export default function TransmitLayout({ children }: TransmitLayoutProps): React.JSX.Element {
  return <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">{children}</div>;
}
