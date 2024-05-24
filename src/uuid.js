function generateUUID() {
  let uuid = "";

  // Generate a random 32-bit value
  function getRandomValue() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  // Generate a random 16-bit value
  function getRandomShortValue() {
    return Math.floor((1 + Math.random()) * 0x4000)
      .toString(16)
      .substring(1);
  }

  // Generate the UUID components
  uuid += getRandomValue() + getRandomValue() + "-";
  uuid += getRandomValue() + "-";
  uuid += getRandomShortValue() + "-";
  uuid += getRandomShortValue() + "-";
  uuid += getRandomValue() + getRandomValue() + getRandomValue();

  return uuid;
}

module.exports = generateUUID;
