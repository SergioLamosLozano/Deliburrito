import React from 'react';

export default function Print({ order }) {
  React.useEffect(() => {
    window.print();
  }, []);

  return (
    <div className="p-8 bg-white">
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none; }
          .print-container { width: 80mm; margin: 0 auto; }
        }
      `}</style>

      <div className="print-container" style={{ width: '80mm', margin: '0 auto', fontFamily: '"Courier New", Courier, monospace', color: '#000' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>DELI BURRITO</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>*** COMANDA DE COCINA ***</div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>Orden #{ order.id }</div>
        </div>

        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #000' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', marginBottom: '5px' }}>{ order.customer_name.toUpperCase() }</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>📞 { order.customer_phone }</div>
          {order.customer_address && (
            <div style={{ fontSize: '13px', marginTop: '3px' }}>📍 { order.customer_address }</div>
          )}
          <div style={{ fontSize: '14px', fontWeight: '900', marginTop: '8px', borderTop: '1px solid #000', paddingTop: '5px' }}>
            TIPO: { order.delivery_type === 'domicilio' ? '🚗 DOMICILIO' : order.delivery_type === 'local' ? '🏪 LOCAL' : '📦 RECOGER' }
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: '900', fontSize: '14px', borderBottom: '1px solid #000', marginBottom: '10px' }}>DETALLE DEL PEDIDO:</div>
          {order.items.map((item, idx) => (
            <div key={item.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
              <div style={{ fontSize: '16px', fontWeight: '900', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.product_type === 'burrito' ? '🌯 BURRITO' : '🍔 TORTIHAMBURGU'}</span>
                <span>#{idx + 1}</span>
              </div>
              
              <div style={{ paddingLeft: '5px' }}>
                {item.options.map(opt => (
                  <div key={opt.id} style={{ fontSize: '13px', marginBottom: '2px', display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ marginRight: '5px' }}>-</span>
                    <span style={{ fontWeight: opt.is_primary ? '900' : 'normal' }}>
                      {opt.option.name} {opt.is_primary ? '(PRINCIPAL)' : ''}
                    </span>
                  </div>
                ))}
              </div>

              {item.notes && (
                <div style={{ marginTop: '5px', fontSize: '12px', fontStyle: 'italic', color: '#444' }}>
                  Nota: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px', paddingTop: '10px', borderTop: '2px solid #000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
            <span>Subtotal:</span>
            <span>${order.subtotal.toLocaleString()}</span>
          </div>
          {order.delivery_cost > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
              <span>Envío:</span>
              <span>${order.delivery_cost.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '20px', marginTop: '10px', borderTop: '1px double #000', paddingTop: '5px' }}>
            <span>TOTAL:</span>
            <span>${order.total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', borderTop: '1px solid #000', paddingTop: '10px' }}>
          <div style={{ fontWeight: 'bold' }}>{new Date(order.created_at).toLocaleString()}</div>
          <div style={{ marginTop: '15px', fontSize: '14px', fontWeight: '900' }}>¡A COCINAR! 🔥🔥🔥</div>
        </div>
      </div>
    </div>
  );
}
