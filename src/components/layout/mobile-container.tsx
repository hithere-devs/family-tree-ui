export const MobileContainer = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return (
		<div className='flex h-screen w-full flex-col bg-white'>{children}</div>
	);
};
