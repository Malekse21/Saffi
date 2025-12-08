import React from "react";

// StatCard Skeleton - For stats cards in accueil and analytics
export const StatCardSkeleton = () => (
    <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000] animate-pulse">
        <div className="h-4 w-24 bg-gray-200 mb-2"></div>
        <div className="h-8 w-16 bg-gray-300"></div>
    </div>
);

// PatientCard Skeleton - For patient queue cards
export const PatientCardSkeleton = () => (
    <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000] animate-pulse">
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gray-200 border-2 border-black"></div>
                <div className="space-y-2">
                    <div className="h-5 w-32 bg-gray-300"></div>
                    <div className="h-3 w-24 bg-gray-200"></div>
                </div>
            </div>
            <div className="h-6 w-6 bg-gray-200"></div>
        </div>
        <div className="flex gap-2 mt-3">
            <div className="h-8 w-20 bg-gray-200 border-2 border-black"></div>
            <div className="h-8 w-20 bg-gray-200 border-2 border-black"></div>
        </div>
    </div>
);

// CalendarDay Skeleton - For calendar grid cells
export const CalendarDaySkeleton = () => (
    <div className="min-h-[90px] p-2 border-2 border-black bg-gray-50 animate-pulse">
        <div className="h-4 w-6 bg-gray-200"></div>
    </div>
);

// CalendarGrid Skeleton - Full calendar grid
export const CalendarGridSkeleton = () => (
    <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 35 }).map((_, i) => (
            <CalendarDaySkeleton key={i} />
        ))}
    </div>
);

// AppointmentCard Skeleton - For appointment list in calendar
export const AppointmentCardSkeleton = () => (
    <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000] animate-pulse">
        <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-20 bg-gray-200 border-2 border-black"></div>
        </div>
        <div className="space-y-2">
            <div className="h-5 w-3/4 bg-gray-300"></div>
            <div className="h-4 w-1/2 bg-gray-200"></div>
            <div className="h-4 w-2/3 bg-gray-200"></div>
        </div>
    </div>
);

// Chart Skeleton - For analytics charts
export const ChartSkeleton = ({ height = "300px" }: { height?: string }) => (
    <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] animate-pulse">
        <div className="h-6 w-48 bg-gray-300 mb-4"></div>
        <div className="flex items-end gap-2" style={{ height }}>
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="flex-1 bg-gray-200 border-2 border-black"
                    style={{ height: `${Math.random() * 60 + 40}%` }}
                ></div>
            ))}
        </div>
    </div>
);

// Form Skeleton - For profile and settings forms
export const FormSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_#000]">
            <div className="h-6 w-40 bg-gray-300 mb-4"></div>
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                        <div className="h-4 w-24 bg-gray-200 mb-2"></div>
                        <div className="h-10 w-full bg-gray-100 border-2 border-black"></div>
                    </div>
                ))}
            </div>
        </div>
        <div className="h-12 w-32 bg-gray-300 border-2 border-black"></div>
    </div>
);

// QR Code Skeleton - For QR station page
export const QRCodeSkeleton = () => (
    <div className="border-2 border-black p-8 bg-white shadow-[4px_4px_0px_0px_#000] animate-pulse">
        <div className="h-6 w-48 bg-gray-300 mb-6 mx-auto"></div>
        <div className="h-64 w-64 bg-gray-200 border-2 border-black mx-auto mb-6"></div>
        <div className="h-4 w-32 bg-gray-200 mx-auto"></div>
    </div>
);
