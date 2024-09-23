function allocatePointsPerLevel(numLevels) {
  const totalPoints = 1000;
  let pointsPerLevel = [];
  let remainingPoints = totalPoints;

  for (let i = 1; i <= numLevels; i++) {
    let points = Math.round(
      (i / ((numLevels * (numLevels + 1)) / 2)) * totalPoints,
    );

    points = Math.min(points, remainingPoints);

    if (i === numLevels) {
      points = remainingPoints;
    }

    pointsPerLevel.push(points);
    remainingPoints -= points;
  }

  return pointsPerLevel;
}

export default allocatePointsPerLevel;
