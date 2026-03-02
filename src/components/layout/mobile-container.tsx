export const MobileContainer = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return (
		<div className='flex bg-white h-screen w-full flex-col md:items-center md:justify-center md:bg-gray-100 md:p-4'>
			<div className='relative mx-auto flex h-full w-full flex-col overflow-hidden bg-white md:h-[820px] md:max-w-[390px] md:rounded-[40px] md:border-8 md:border-gray-900 md:shadow-2xl'>
				{/* Signal bars overlay (visible only on desktop frame) */}
				<div className='hidden absolute left-1/2 top-0 z-50 h-6 w-32 -translate-x-1/2 rounded-b-3xl bg-gray-900 md:block'></div>

				{/* Content */}
				<div className='h-full w-full overflow-hidden flex flex-col'>
					{children}
				</div>
			</div>
		</div>
	);
};
