import React, { useState, useEffect, useMemo } from 'react';

export default function BurritoBuilder({ onCheckout, initialCart = [], showToast }) {
  const [categories,  setCategories]  = useState([]);
  const [variations,  setVariations]  = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading,     setLoading]     = useState(true);

  const [productType,       setProductType]       = useState(null);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [step,      setStep]      = useState(1);
  const [selection, setSelection] = useState({});
  const [cart,      setCart]      = useState(initialCart);

  const productTypeData = useMemo(() => 
    productTypes.find(t => t.slug === productType),
    [productTypes, productType]
  );

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/menu').then(r => r.json()),
      fetch('/variations').then(r => r.json()),
      fetch('/product-types').then(r => r.json()),
    ])
      .then(([menuData, varData, typeData]) => {
        setCategories(menuData);
        setVariations(Array.isArray(varData) ? varData : []);
        setProductTypes(Array.isArray(typeData) ? typeData : []);
        const init = {};
        menuData.forEach(cat => { init[cat.id] = cat.max_selections === 1 ? null : []; });
        setSelection(init);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Variaciones activas del tipo elegido ─────────────────────────────────
  const activeVariations = useMemo(() =>
    variations.filter(v => v.product_target === productType && Number(v.is_active) === 1),
    [variations, productType]
  );

  // ── Hay variaciones configuradas para este tipo ──────────────────────────
  const typeHasVariations = activeVariations.length > 0;

  // ── Filtrado de categorías ───────────────────────────────────────────────
  // Regla definitiva:
  //
  // BURRITO (sin variaciones activas):
  //   → Mostrar todas las categorías de product_type 'burrito' o 'ambos'
  //     que NO tengan variations[] (sin restricción), o cuya variations[]
  //     no sea exclusiva de tortihamburguesa.
  //
  // TORTIHAMBURGUESA con variaciones activas:
  //   → Una categoría se muestra SI Y SOLO SI tiene la variación elegida
  //     en su variations[]. Punto. No importa product_type ni nada más.
  //   → Si variations[] está vacío → NO se muestra (no está asignada a nada).
  //
  // TORTIHAMBURGUESA sin variaciones activas (legacy):
  //   → Mostrar todas las de product_type 'tortihamburguesa' o 'ambos'.
  const filteredCategories = useMemo(() => {
    if (!productType) return [];

    if (typeHasVariations) {
      if (!selectedVariation) return [];
      return categories
        .filter(cat => (cat.variations ?? []).some(v => v.id === selectedVariation.id))
        .map(cat => {
          const pivotVar = cat.variations.find(v => v.id === selectedVariation.id);
          const override = pivotVar?.pivot?.max_selections;
          if (override !== undefined && override !== null) {
            return { ...cat, max_selections: Number(override) };
          }
          return cat;
        });
    }

    // Sin variaciones → filtro normal por product_type
    return categories.filter(
      cat => cat.product_type === 'ambos' || cat.product_type === productType
    );
  }, [categories, productType, selectedVariation, typeHasVariations]);

  const currentCategory = filteredCategories[step - 1];

  // ── Precio total ─────────────────────────────────────────────────────────
  const calculateTotal = () => {
    let total = selectedVariation ? parseFloat(selectedVariation.price || 0) : 0;
    filteredCategories.forEach(cat => {
      const sel = selection[cat.id];
      const items = Array.isArray(sel) ? sel : (sel ? [sel] : []);
      items.forEach(item => { total += parseFloat(item.price || 0) * (item.quantity || 1); });
    });
    return total;
  };
  const currentTotal = calculateTotal();
  
  const resetBuilder = () => {
    const init = {};
    categories.forEach(cat => { init[cat.id] = cat.max_selections === 1 ? null : []; });
    setSelection(init);
    setStep(1);
    setSelectedVariation(null);
    setProductType(null);
  };

  // ── Selección de opciones ────────────────────────────────────────────────
  const toggleSelection = (categoryId, option) => {
    const cat = filteredCategories.find(c => c.id === categoryId);
    if (!cat) return;

    if (cat.allow_quantity == 1) {
      updateQuantity(categoryId, option, 1);
      return;
    }

    if (cat.max_selections === 1) {
      setSelection(prev => ({ ...prev, [cat.id]: prev[cat.id]?.id === option.id ? null : option }));
    } else {
      setSelection(prev => {
        const current = prev[cat.id] || [];
        const isSelected = current.some(o => o.id === option.id);
        if (isSelected) return { ...prev, [cat.id]: current.filter(o => o.id !== option.id) };
        if (current.length >= cat.max_selections) return { ...prev, [cat.id]: [...current.slice(1), option] };
        return { ...prev, [cat.id]: [...current, option] };
      });
    }
  };

  const updateQuantity = (categoryId, option, delta) => {
    setSelection(prev => {
      const current = prev[categoryId] || [];
      const item = current.find(o => o.id === option.id);
      
      if (!item) {
        if (delta > 0) return { ...prev, [categoryId]: [...current, { ...option, quantity: 1 }] };
        return prev;
      }

      const newQty = (item.quantity || 1) + delta;
      if (newQty <= 0) return { ...prev, [categoryId]: current.filter(o => o.id !== option.id) };
      
      return {
        ...prev,
        [categoryId]: current.map(o => o.id === option.id ? { ...o, quantity: newQty } : o)
      };
    });
  };

  const isStepValid = () => {
    const cat = filteredCategories[step - 1];
    if (!cat) return true;
    if (Number(cat.is_required) === 1) {
      const sel = selection[cat.id];
      if (!sel || (Array.isArray(sel) && sel.length === 0)) return false;
    }
    return true;
  };

  // ── Agregar al carrito ───────────────────────────────────────────────────
  const addToCart = () => {
    const options = [];
    filteredCategories.forEach(cat => {
      const sel = selection[cat.id];
      const items = Array.isArray(sel) ? sel : (sel ? [sel] : []);
      items.forEach(it => options.push({ 
        option_id: it.id, 
        quantity: it.quantity || 1,
        is_primary: false 
      }));
    });

    const varName = selectedVariation ? selectedVariation.name : '';
    const displayName = `${productTypeData?.emoji || '🍔'} ${productTypeData?.name} ${varName}`.trim();

    setCart(prev => [...prev, {
      id: Date.now(),
      product_type: productType,
      variation_id: selectedVariation?.id ?? null,
      variation_name: selectedVariation?.name ?? null,
      options,
      notes: '',
      item_total: currentTotal,
      display_name: displayName,
      selection_summary: options
        .map(o => categories.flatMap(c => c.options ?? []).find(op => op.id === o.option_id)?.name ?? '')
        .filter(Boolean).join(', '),
    }]);
    resetBuilder();
    showToast('¡Agregado al carrito!', 'success');
  };

  const goToCheckout = () => {
    if (cart.length === 0) return showToast('Tu carrito está vacío', 'error');
    onCheckout(cart);
  };

  const handleSelectProductType = (type) => { 
    resetBuilder();
    setProductType(type); 
  };
  const handleSelectVariation   = (v)    => { setSelectedVariation(v); setStep(1); };

  // Atrás desde el constructor: paso anterior → variación → inicio
  const handleBack = () => {
    if (step > 1) { setStep(step - 1); return; }
    if (typeHasVariations && selectedVariation) { setSelectedVariation(null); return; }
    resetBuilder();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50">
      <p className="text-xl font-bold text-red-600">Cargando menú...</p>
    </div>
  );

  const showTypeSelector      = !productType;
  const showVariationSelector = productType && typeHasVariations && !selectedVariation;
  const showBuilder           = productType && !showVariationSelector;

  return (
    <div className="min-h-screen bg-yellow-50">

      {/* Marca de agua */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/deliburrito.webp" alt="" className="w-[480px] max-w-[70vw] opacity-[0.06] select-none" />
      </div>

      {/* Header */}
      <header className="bg-red-600 text-white sticky top-0 z-50 px-4 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="cursor-pointer flex items-center gap-3"
            onClick={resetBuilder}>
            <img src="/deliburrito.webp" alt="Deli Burrito" className="h-16 w-auto" />
            <h1 className="text-2xl font-black italic tracking-tighter">
              DELI<span className="text-yellow-300">BURRITO</span>
            </h1>
          </div>
          <button onClick={goToCheckout}
            className="relative bg-yellow-400 text-red-700 px-5 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:bg-yellow-300 transform active:scale-95 transition-all shadow-lg">
            <span className="text-xl">🛒</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md border-2 border-red-600">
                {cart.length}
              </span>
            )}
            <span className="hidden sm:inline">VER CARRITO</span>
          </button>
        </div>
      </header>

      {/* ── PANTALLA 1: Elegir tipo ──────────────────────────────────────── */}
      {showTypeSelector && (
        <div className="relative z-10 max-w-6xl mx-auto p-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <h1 className="text-3xl sm:text-5xl font-black text-red-600 mb-2 text-center uppercase tracking-tighter">
            ¿Qué te vas a armar hoy?
          </h1>
          <p className="text-gray-500 font-bold mb-10 text-center uppercase text-[10px] tracking-[0.2em]">
            Selecciona tu base preferida
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {productTypes.map(t => (
              <button key={t.slug} onClick={() => handleSelectProductType(t.slug)}
                className="group bg-white p-8 rounded-[3rem] shadow-2xl hover:shadow-red-200 transition-all border-4 border-gray-50 hover:border-red-500 flex flex-col items-center text-center">
                {t.image_path 
                  ? <img src={t.image_path} className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-[2rem] mb-4 sm:mb-6 transform group-hover:scale-110 transition-transform shadow-xl" alt={t.name} />
                  : <span className="text-6xl sm:text-8xl mb-4 sm:mb-6 transform group-hover:scale-110 transition-transform">{t.emoji || '🍔'}</span>
                }
                <h2 className="text-sm sm:text-lg lg:text-xl font-black text-gray-800 uppercase tracking-tight leading-tight w-full px-2">{t.name}</h2>
                <p className="text-gray-400 font-bold mt-2 uppercase text-[8px] sm:text-[9px] tracking-widest leading-tight px-2 sm:px-4">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PANTALLA 2: Elegir variación ─────────────────────────────────── */}
      {showVariationSelector && (
        <div className="relative z-10 max-w-3xl mx-auto p-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">

          {/* Botón volver — mismo estilo que la casita del constructor */}
          <div className="w-full flex justify-start mb-8">
            <button
              onClick={() => setProductType(null)}
              className="w-14 h-14 bg-white rounded-full shadow-lg border border-gray-100 text-2xl flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all active:scale-95"
            >
              🏠
            </button>
          </div>

          {productTypeData?.image_path 
            ? <img src={productTypeData.image_path} className="w-24 h-24 object-cover rounded-[2rem] mb-4 shadow-xl" alt="" />
            : <span className="text-7xl mb-4">{productTypeData?.emoji || '🍔'}</span>
          }
          <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2 text-center uppercase tracking-tighter">
            ¿Qué tipo de {productTypes.find(t => t.slug === productType)?.name}?
          </h1>
          <p className="text-gray-400 font-bold mb-10 text-center uppercase text-[10px] tracking-[0.2em]">
            Elige tu variación para continuar
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {activeVariations.map(v => (
              <button key={v.id} onClick={() => handleSelectVariation(v)}
                className="group bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-orange-200 transition-all border-4 border-gray-50 hover:border-orange-500 flex flex-col items-center text-center active:scale-95">
                {productTypeData?.image_path 
                  ? <img src={productTypeData.image_path} className="w-20 h-20 object-cover rounded-2xl mb-4 transform group-hover:scale-110 transition-transform shadow-lg" alt="" />
                  : <span className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">{productTypeData?.emoji || '🍔'}</span>
                }
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{v.name}</h2>
                <p className="text-orange-500 font-black mt-2 text-lg">
                  ${parseInt(v.price).toLocaleString()}
                </p>
                {v.description && (
                  <div className="mt-4 pt-3 border-t border-gray-100 w-full group-hover:border-orange-200 transition-colors">
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.15em] mb-1">
                      ✨ INGREDIENTES INCLUIDOS:
                    </p>
                    <p className="text-gray-600 text-[11px] font-bold leading-tight px-2 italic">
                      {v.description}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PANTALLA 3: Constructor paso a paso ─────────────────────────── */}
      {showBuilder && currentCategory && (
        <main className="relative z-10 max-w-6xl mx-auto p-4 py-6">

          {/* Pill de variación elegida — sin flecha, solo info + botón cambiar */}
          {selectedVariation && (
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedVariation(null)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-md border border-orange-100 hover:border-orange-400 hover:shadow-lg transition-all active:scale-95 group"
              >
                <span className="text-base">🍔</span>
                <span className="text-sm font-black text-orange-600 uppercase tracking-wide">
                  {selectedVariation.name}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  ${parseInt(selectedVariation.price).toLocaleString()}
                </span>
                <span className="text-[10px] font-black text-gray-300 group-hover:text-orange-500 transition-colors uppercase tracking-widest ml-1">
                  cambiar
                </span>
              </button>
            </div>
          )}

          {/* Barra de progreso */}
          <div className="bg-white/90 backdrop-blur-lg p-4 rounded-[2.5rem] shadow-xl mb-8 flex items-center gap-3 border border-gray-100 sticky top-20 z-40 overflow-x-auto no-scrollbar">

            {/* Casita — siempre va al inicio absoluto */}
            <button
              onClick={() => { setProductType(null); setSelectedVariation(null); setStep(1); }}
              className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full text-xl sm:text-3xl shadow-inner flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0 active:scale-95"
            >
              🏠
            </button>

            {/* Círculos numerados */}
            <div className="flex gap-2 sm:gap-3">
              {filteredCategories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => (idx < step || isStepValid()) ? setStep(idx + 1) : null}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full font-black text-lg sm:text-2xl flex items-center justify-center transition-all shrink-0 ${
                    step === idx + 1
                      ? 'bg-red-600 text-white shadow-2xl scale-110'
                      : step > idx + 1
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="hidden md:block flex-1 text-right pr-4">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block leading-none mb-1">
                PASO {step} DE {filteredCategories.length}
              </span>
              <span className="text-2xl font-black text-red-600 uppercase tracking-tighter leading-none">
                {currentCategory.name}
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* Opciones */}
            <div className="lg:col-span-2">
              <div className="bg-white p-4 sm:p-6 rounded-[2.5rem] shadow-xl border border-gray-100 min-h-[400px]">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
                    {currentCategory.name}
                  </h2>
                  {currentCategory.max_selections > 1 && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Elige hasta {currentCategory.max_selections}
                      </span>
                      <div className="bg-red-600 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase shadow-lg shadow-red-100">
                        {(selection[currentCategory.id] || []).length} / {currentCategory.max_selections} OK
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {currentCategory.name.toLowerCase().includes('salsa') && (
                    <button
                      onClick={() => setSelection(prev => ({ ...prev, [currentCategory.id]: [] }))}
                      className={`relative p-3 sm:p-4 rounded-3xl border-4 text-left transition-all group ${
                        (selection[currentCategory.id] || []).length === 0
                          ? 'border-gray-800 bg-gray-100'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <span className="text-base font-bold leading-tight mb-2 uppercase text-gray-900">Sin Salsas</span>
                        <span className="font-black text-sm text-gray-400">NINGUNA</span>
                      </div>
                      {(selection[currentCategory.id] || []).length === 0 && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-lg bg-gray-800">✓</div>
                      )}
                    </button>
                  )}

                  {(currentCategory.options ?? []).map(option => {
                    const allowQty = currentCategory.allow_quantity == 1;
                    const isSingle = currentCategory.max_selections === 1 && !allowQty;
                    
                    const sel = selection[currentCategory.id];
                    const isSelected = isSingle
                      ? sel?.id === option.id
                      : (sel || []).some(o => o.id === option.id);
                    
                    const item = (allowQty || !isSingle) 
                      ? (Array.isArray(sel) ? sel.find(o => o.id === option.id) : null)
                      : (isSelected ? sel : null);
                    const quantity = item?.quantity || (isSelected ? 1 : 0);

                    return (
                      <div key={option.id} className="relative group">
                        <button
                          onClick={() => toggleSelection(currentCategory.id, option)}
                          className={`w-full p-3 sm:p-4 rounded-3xl border-4 text-left transition-all min-h-[90px] flex items-center ${
                            isSelected
                              ? isSingle ? 'border-red-600 bg-red-50' : 'border-green-600 bg-green-50'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col h-full justify-center pr-10">
                            <span className={`text-base font-bold leading-tight mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                              {option.name}
                            </span>
                            <span className={`font-black text-sm ${isSelected ? 'text-red-600' : 'text-gray-400'}`}>
                              {parseFloat(option.price) > 0
                                ? `+${parseInt(option.price).toLocaleString()}`
                                : 'GRATIS'}
                            </span>
                          </div>
                        </button>
                        
                        {allowQty && isSelected && (
                          <div className="absolute top-1/2 -translate-y-1/2 right-1.5 flex flex-col items-center gap-0.5 bg-white rounded-xl shadow-lg border border-gray-100 p-0.5 z-10">
                             <button 
                               onClick={(e) => { e.stopPropagation(); updateQuantity(currentCategory.id, option, 1); }}
                               className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-green-100 text-green-600 flex items-center justify-center font-black transition-colors text-[10px]"
                             >+</button>
                             <span className="h-4 flex items-center justify-center font-black text-[9px] text-gray-800">{quantity}</span>
                             <button 
                               onClick={(e) => { e.stopPropagation(); updateQuantity(currentCategory.id, option, -1); }}
                               className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-red-100 text-red-600 flex items-center justify-center font-black transition-colors text-[10px]"
                             >-</button>
                          </div>
                        )}
                        
                        {isSelected && !allowQty && (
                          <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-lg ${isSingle ? 'bg-red-600' : 'bg-green-600'}`}>✓</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navegación inferior */}
              <div className="flex gap-3 mt-6">
                <button onClick={handleBack}
                  className="flex-1 p-4 bg-white rounded-3xl font-black text-gray-500 shadow-lg border border-gray-200 hover:bg-gray-50 transition-all active:scale-95">
                  ATRÁS
                </button>
                <button
                  onClick={() => { if (step < filteredCategories.length) setStep(step + 1); else addToCart(); }}
                  disabled={!isStepValid()}
                  className={`flex-[2] p-4 rounded-3xl font-black shadow-xl transition-all active:scale-95 ${
                    isStepValid() ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {step < filteredCategories.length ? 'SIGUIENTE PASO →' : '✓ LISTO, AGREGAR'}
                </button>
              </div>
            </div>

            {/* Resumen lateral */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-yellow-400 sticky top-24">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    {productTypeData?.name || 'Tu Pedido'}
                  </h3>
                  {productTypeData?.image_path 
                    ? <img src={productTypeData.image_path} className="w-10 h-10 object-cover rounded-xl shadow-sm" alt="" />
                    : <span className="text-2xl">{productTypeData?.emoji || '🍔'}</span>
                  }
                </div>

                <div className="space-y-3 mb-6 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedVariation && (
                    <div className="flex justify-between text-sm font-bold border-b border-gray-100 pb-2">
                      <span className="text-orange-600 uppercase">BASE: {selectedVariation.name}</span>
                      <span className="text-red-600">${parseInt(selectedVariation.price).toLocaleString()}</span>
                    </div>
                  )}
                  {filteredCategories.map(cat => {
                    const sel = selection[cat.id];
                    const items = Array.isArray(sel) ? sel : (sel ? [sel] : []);
                    return items.map(it => (
                      <div key={it.id} className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400 uppercase">
                          {it.quantity > 1 ? `(${it.quantity}) ` : ''}{it.name}
                        </span>
                        {(parseFloat(it.price) || 0) > 0 && (
                          <span className="text-green-600">+${parseInt(it.price * (it.quantity || 1)).toLocaleString()}</span>
                        )}
                      </div>
                    ));
                  })}
                </div>

                <div className="border-t-2 border-dashed border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase">TOTAL ACTUAL</span>
                    <span className="text-3xl font-black text-red-600">${(currentTotal || 0).toLocaleString()}</span>
                  </div>
                </div>

                <button onClick={addToCart}
                  className="w-full py-4 bg-yellow-400 text-red-900 rounded-3xl font-black text-lg shadow-xl hover:bg-yellow-300 active:scale-95 transition-all">
                  AGREGAR A LA ORDEN
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fee2e2; border-radius: 10px; }
      `}</style>
    </div>
  );
}
