import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CvBuilderPage from './CvBuilderPage';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'ROLE_USER', fullName: 'Nguyễn Minh An', email: 'an@example.com' },
  }),
}));

const renderPage = () => render(
  <MemoryRouter>
    <CvBuilderPage />
  </MemoryRouter>,
);

describe('CvBuilderPage', () => {
  it('updates the live CV preview as profile fields change', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Nguyễn Minh An' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Linh Nguyễn' } });
    fireEvent.change(screen.getByLabelText('Vị trí mong muốn'), { target: { value: 'Product Designer' } });

    expect(screen.getByRole('heading', { name: 'Linh Nguyễn' })).toBeInTheDocument();
    expect(screen.getByText('Product Designer')).toBeInTheDocument();
  });

  it('adds experience entries and reflects them in the preview', () => {
    renderPage();

    fireEvent.click(screen.getAllByRole('button', { name: 'Thêm' })[0]);
    fireEvent.change(screen.getByLabelText('Chức danh'), { target: { value: 'UX Designer' } });
    fireEvent.change(screen.getByLabelText('Công ty'), { target: { value: 'Studio North' } });

    expect(screen.getByRole('heading', { name: 'UX Designer' })).toBeInTheDocument();
    expect(screen.getByText('Studio North')).toBeInTheDocument();
  });

  it('opens the browser print dialog from the PDF action', () => {
    const print = jest.spyOn(window, 'print').mockImplementation(() => undefined);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'In / lưu PDF' }));

    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });
});
