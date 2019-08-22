/**
 * Parse an Xpath into a list of nodes
 * @param {string} pathString 
 */
export function tokenizePaths (pathString) {
  let pathIndex = 0;
  let pathArr = pathString.split('');
  let currNode = {};
  let outputNodes = [];

  while (pathIndex < pathArr.length) {
    let ch = pathArr[pathIndex];
    if (ch === '/') {
        currNode = {
          isDirectChild: true,
          attributes: [],
          className: null,
          isWildcard: false,
        };

        // Lookahead to next to see if it's direct child or global child
        if (pathArr[pathIndex + 1] === '\/') {
          currNode.isDirectChild = false;
          pathIndex++;
        }

        pathIndex++;

        let className = "";
        ch = pathArr[pathIndex];
        while (ch && ch != '[' && ch != '/' && ch != ']') {
          className += pathArr[pathIndex];
          pathIndex++;
          ch = pathArr[pathIndex];
        }
        currNode.className = className;
        currNode.isWildcard = className === '*';

        if (pathArr[pathIndex] === ']') {
          throw Error(`Closing attributes character ']' at column ${pathIndex} is missing an opening attributes character`);
        }

        if (pathArr[pathIndex] == '[') {
          pathIndex++;
          while (pathArr[pathIndex] != ']') {
            ch = pathArr[pathIndex];
            if (ch === '@') {
              let attributeName = '';
              pathIndex++;
              while (pathArr[pathIndex] !== '=') {
                attributeName += pathArr[pathIndex];
                pathIndex++;
              }
            } else {
              
            }
            pathIndex++;
          }
        }

        outputNodes.push(currNode);
    }
    return outputNodes;
  }
}
