import { cellsToWorld, stepWorld, worldToCells } from './infinite';

test('sparse worlds preserve a glider across four generations', () => {
  let world = cellsToWorld([[1, 2], [2, 3], [3, 1], [3, 2], [3, 3]]);
  for (let generation = 0; generation < 4; generation += 1) world = stepWorld(world);
  expect(worldToCells(world)).toEqual(expect.arrayContaining([[2, 3], [3, 4], [4, 2], [4, 3], [4, 4]]));
});

test('sparse simulation obeys its configured population limit', () => {
  const world = cellsToWorld([[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]]);
  expect(stepWorld(world, 2).size).toBeLessThanOrEqual(2);
});
