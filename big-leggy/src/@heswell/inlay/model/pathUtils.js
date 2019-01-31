
export function followPath(model, path) {

    if (path.indexOf(model.$path) !== 0) {
        throw Error(`pathUtils.followPath path ${path} is not within model.path ${model.$path}`);
    }

    var route = path.slice(model.$path.length + 1);
    if (route === '') {
        return model;
    }
    var paths = route.split('.');

    for (var i = 0; i < paths.length; i++) {

        if (model.children === undefined) {
            console.log(`model at 0.${paths.slice(0, i).join('.')} has no children, so cannot fulfill rest of path ${paths.slice(i).join('.')}`);
            return;
        }

        model = (model.children)[paths[i]];

        if (model === undefined) {
            console.log(`model at 0.${paths.slice(0, i).join('.')} has no children that fulfill next step of path ${paths.slice(i).join('.')}`);
            return;
        }
    }
    return model;
}

export function followPathToParent(layout, path) {

    if (path === '0') return null;
    if (path === layout.$path) return null;

    return followPath(layout, path.replace(/.\d+$/, ''));
}

export function breadcrumb(model, path){
    if (!model){
        return [];
    }
    if (path.indexOf(model.$path) !== 0) {
        throw Error(`pathUtils.breadcrumb path ${path} is not within model.path ${model.$path}`);
    }

    const result = [model];

    const route = path.slice(model.$path.length + 1);
    if (route === '') {
        return result;
    }

    const paths = route.split('.');
    for (var i = 0; i < paths.length; i++) {
        if (model.children === undefined) {
            console.log(`model at 0.${paths.slice(0, i).join('.')} has no children, so cannot fulfill rest of path ${paths.slice(i).join('.')}`);
            return [];
        }
        result.push(model = (model.children)[paths[i]]);
        if (model === undefined) {
            console.log(`model at 0.${paths.slice(0, i).join('.')} has no children that fulfill next step of path ${paths.slice(i).join('.')}`);
            return [];
        }
    }
    return result;
}

export function adjustPath(path, removedPath, containerRemoved) {

    var steps = path.split('.');
    var rem = removedPath.split('.');

    // pos needs to be first point at which paths differ, not necessarily last pos
    var pos = forkPoint(steps, rem);
    var remIdx = parseInt(rem[pos]);
    var stepIdx = parseInt(steps[pos]);

    if (pos === rem.length - 1) {

        if (containerRemoved === 1) {
            steps.splice(pos, 1);
            return steps.join('.');
        }
        else if (containerRemoved === 2) {
            steps.splice(pos - 1, 2);
            var topLevelIdx = parseInt(rem[pos - 1], 10);
            steps[pos - 1] = parseInt(steps[pos - 1]) + topLevelIdx;

            return steps.join('.');
        }

        if (remIdx < stepIdx) {
            steps[pos] = parseInt(steps[pos]) - 1;
            return steps.join('.')
        }

    }

    if (containerRemoved && remIdx === stepIdx) {
        return path.replace(/.\d+$/, '');
    } else {
        return path;
    }
}

function forkPoint(path1, path2) {
    var len = Math.min(path1.length, path2.length);

    for (var i = 0; i < len; i++) {
        if (path1[i] !== path2[i]) {
            return i;
        }
    }
    return -1;
}

export function nextStep(pathSoFar, targetPath) {
    if (pathSoFar === targetPath) {
        return { idx: -1, finalStep: true };
    }
    var regex = new RegExp(`^${pathSoFar}.`);
    // check that pathSoFar startsWith targetPath and if not, throw
    var paths = targetPath.replace(regex, '').split('.').map(n => parseInt(n, 10));
    return { idx: paths[0], finalStep: paths.length === 1 };
}
