import React from 'react';
import DrawerNavigator from './DrawerNavigator'; // Ganti ke DrawerNavigator

const Navigation = () => {
  return (
    // Komponen ini sekarang hanya bertanggung jawab untuk merender navigator utama.
    // NavigationContainer akan dipindahkan ke App.tsx.
    <DrawerNavigator />
  );
};

export default Navigation;