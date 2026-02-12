'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export default forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      // The API returns 'label', so we use that here
      props.command({ id: item.id, label: item.label });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items || props.items.length === 0) {
    return <div className="px-3 py-2 text-xs text-slate-400">No results found</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden min-w-[200px] flex flex-col p-1">
      {props.items.map((item: any, index: number) => (
        <button
          key={item.id}
          className={`text-left px-3 py-2 text-sm rounded-md flex justify-between items-center w-full ${
            index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
          }`}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)} // Better UX for mouse users
        >
          {/* USE item.label HERE */}
          <span className="font-medium truncate mr-2">{item.label}</span>
          
          {/* Only show type if it exists */}
          {item.type && (
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold text-[10px]">
              {item.type}
            </span>
          )}
        </button>
      ))}
    </div>
  );
});