"use client"

import { useState } from "react"
import { SearchModal } from "../search-modal"

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

export function SearchButton() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      {/* Mobile search icon button */}
      <button
        className="small:hidden flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors"
        onClick={() => setIsSearchOpen(true)}
        aria-label="Search"
      >
        <SearchIcon />
      </button>

      {/* Desktop search input */}
      <div className="relative mr-2 hidden small:inline-flex">
        <input
          type="text"
          placeholder="Search for products"
          className="bg-gray-100 text-zinc-900 px-4 py-2 rounded-full pr-10 shadow-borders-base cursor-pointer"
          onClick={() => setIsSearchOpen(true)}
          readOnly
        />
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}