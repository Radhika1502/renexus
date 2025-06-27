import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export async function testKeyboardNavigation(Component: React.ReactElement) {
  render(Component);
  
  // Get all interactive elements
  const interactiveElements = screen.getAllByRole('button', { hidden: true })
    .concat(screen.getAllByRole('link', { hidden: true }))
    .concat(screen.getAllByRole('textbox', { hidden: true }))
    .concat(screen.getAllByRole('checkbox', { hidden: true }))
    .concat(screen.getAllByRole('radio', { hidden: true }))
    .concat(screen.getAllByRole('combobox', { hidden: true }));

  // Test tab navigation
  await userEvent.tab();
  
  for (let i = 0; i < interactiveElements.length; i++) {
    const element = interactiveElements[i];
    
    // Verify element receives focus
    expect(element).toHaveFocus();
    
    // Test Enter/Space key functionality
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      const clickHandler = jest.fn();
      element.addEventListener('click', clickHandler);
      
      await userEvent.keyboard('{Enter}');
      expect(clickHandler).toHaveBeenCalled();
      
      clickHandler.mockClear();
      await userEvent.keyboard(' ');
      expect(clickHandler).toHaveBeenCalled();
    }
    
    // Move to next element
    await userEvent.tab();
  }
}

export function checkColorContrast(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const bgColor = style.backgroundColor;
  const textColor = style.color;
  
  // This would be replaced with actual contrast ratio calculation
  console.log(`Checking contrast for ${element.tagName}:`);
  console.log(`Background: ${bgColor}, Text: ${textColor}`);
  
  // In a real implementation, we would:
  // 1. Parse colors to RGB
  // 2. Calculate relative luminance
  // 3. Compute contrast ratio
  // 4. Verify against WCAG standards (4.5:1 for normal text)
}
