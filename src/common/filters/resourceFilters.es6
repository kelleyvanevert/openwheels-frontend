
angular.module("filters.resource", [])

.filter("resourcePicture", function ($filter) {
  return function (resource, size = "normal") {
    if (!resource || !resource.pictures || !resource.pictures.length) {
      return defaultPicture(size);
    }
    const pictures = $filter("orderBy")(resource.pictures, "order", false);

    let imageUrl;
    if (pictures[0][size]) {
      imageUrl = pictures[0][size];
      if (!imageUrl.match(/^http/)) {
        imageUrl = appConfig.serverUrl + "/" + imageUrl;
      }
    }
    return imageUrl;
  };
});


function defaultPicture (size) {
  return "assets/img/resource-avatar-" + size + ".jpg";
}
