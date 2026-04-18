import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../test/render';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  it('renders all required form fields', () => {
    renderWithIntl(<ContactForm locale="tr" />);
    expect(screen.getByLabelText(/İsim/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Soyisim/)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-posta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Şirket/)).toBeInTheDocument();
  });

  it('shows validation error when submitting empty form', async () => {
    renderWithIntl(<ContactForm locale="tr" />);
    const submitBtn = screen.getByRole('button', { name: /gönder/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('submit button is present and enabled initially', () => {
    renderWithIntl(<ContactForm locale="tr" />);
    const submitBtn = screen.getByRole('button', { name: /gönder/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  it('KVKK checkbox is present and initially unchecked', () => {
    renderWithIntl(<ContactForm locale="tr" />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    checkboxes.forEach((cb) => {
      expect(cb).not.toBeChecked();
    });
  });
});
