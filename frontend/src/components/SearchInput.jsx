import { SearchIcon } from './Icons';

export default function SearchInput({ value, onChange }) {
  return (
    <div className="search">
      <SearchIcon />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search notes"
        aria-label="Search notes"
        maxLength={100}
      />
    </div>
  );
}
