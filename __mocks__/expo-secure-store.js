// Mock for expo-secure-store
export const setItemAsync = jest.fn(async (key, value) => {
  return Promise.resolve();
});

export const getItemAsync = jest.fn(async (key) => {
  return Promise.resolve(null);
});

export const deleteItemAsync = jest.fn(async (key) => {
  return Promise.resolve();
});
