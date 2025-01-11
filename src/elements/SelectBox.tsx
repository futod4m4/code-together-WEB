import React, { useState, useEffect } from "react";
import "../styles/selectbox.css";

interface SelectBoxProps {
  initialValue: string;
  value: string;
  onSelect: (value: string) => void;
}

interface Option {
  value: string;
  label: string;
  iconClass: string;
}

function SelectBox({ initialValue, value, onSelect }: SelectBoxProps) {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const options: Option[] = [
    { value: "javascript", label: "Javascript", iconClass: "fab fa-brands fa-js" },
    { value: "java", label: "Java", iconClass: "devicon-java-plain colored" },
    { value: "go", label: "Go", iconClass: "fab fa-brands fa-golang" },
    { value: "rust", label: "Rust", iconClass: "devicon-rust-plain colored" },
    { value: "python", label: "Python", iconClass: "devicon-python-plain colored" },
    { value: "php", label: "PHP", iconClass: "devicon-php-plain colored" },
  ];

  // Отслеживаем изменения value из пропсов
  useEffect(() => {
    const currentOption = options.find((option) => option.value === value);
    if (currentOption) {
      setSelectedOption(currentOption);
    }
  }, [value]);

  // Устанавливаем начальное значение из props
  useEffect(() => {
    const initialOption = options.find((option) => option.value === initialValue);
    if (initialOption && !selectedOption) {
      setSelectedOption(initialOption);
    }
  }, [initialValue]);

  const handleOptionSelect = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onSelect) {
      onSelect(option.value);
    }
  };

  return (
    <>
    <form>
      <input
        type="checkbox"
        id="options-checkbox-btn"
        checked={isOpen}
        onChange={() => setIsOpen(!isOpen)}
      />
      <div 
        id="select-btn" 
        className="fx fx-justify-between" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div id="selected-value">
          {selectedOption ? (
            <>
              <i className={selectedOption.iconClass}></i>
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span>Select a language</span>
          )}
        </div>
        <div id="chevrons">
          <i className="fas fa-chevron-up"></i>
          <i className="fas fa-chevron-down"></i>
        </div>
      </div>
      {isOpen && (
        <div id="options">
          {options.map((option) => (
            <div
              className="option"
              key={option.value}
              onClick={() => handleOptionSelect(option)}
            >
              <i className={option.iconClass}></i>
              <span className="option-label">{option.label}</span>
            </div>
          ))}
          <div id="option-bg"></div>
        </div>
      )}
    </form>
    </>
  );
}

export default SelectBox;