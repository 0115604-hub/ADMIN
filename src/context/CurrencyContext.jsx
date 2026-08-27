import React, { createContext, useContext, useState } from "react";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("admin_currency") || "KRW";
  });

  const exchangeRate = 1380; // 1 USD = 1380 KRW (approximate default)

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem("admin_currency", newCurrency);
  };

  const formatAmount = (amountInKRW) => {
    const val = Number(amountInKRW) || 0;
    if (currency === "USD") {
      const inUSD = val / exchangeRate;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(inUSD);
    }
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW"
    }).format(val);
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency, formatAmount, exchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
