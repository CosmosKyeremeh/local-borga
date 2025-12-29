import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface LabelProps {
  order: any;
}

export const PrintableLabel = React.forwardRef<HTMLDivElement, LabelProps>(({ order }, ref) => {
  return (
    <div ref={ref} className="p-8 w-[400px] h-[600px] bg-white text-black flex flex-col border-2 border-black">
      {/* Header */}
      <div className="border-b-4 border-black pb-4 mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Local Borga</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest">Premium Custom Milling</p>
        </div>
        {order.isPremium && (
          <div className="bg-black text-white px-2 py-1 text-[8px] font-black uppercase">Limited Edition</div>
        )}
      </div>

      {/* Order Info */}
      <div className="flex-grow">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase text-gray-500">Product</p>
          <p className="text-2xl font-black uppercase leading-none">{order.itemName}</p>
          <p className="text-sm font-bold mt-1">{order.millingStyle} • {order.weightKg}kg</p>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-black uppercase text-gray-500">Tracking ID</p>
          <p className="text-lg font-mono">#{order.id}</p>
        </div>
      </div>

      {/* QR Code for Customer Tracking */}
      <div className="flex flex-col items-center gap-2 border-t-2 border-black pt-4">
        <QRCodeSVG value={`http://localhost:3000/?track=${order.id}`} size={120} />
        <p className="text-[8px] font-black uppercase tracking-widest text-center">
          Scan to track live production status
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-[10px] font-black italic">By Bongr& - Ghana</p>
      </div>
    </div>
  );
});

PrintableLabel.displayName = 'PrintableLabel';