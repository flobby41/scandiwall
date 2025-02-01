function generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') 
      .replace(/\s+/g, '-')           
      .replace(/-+/g, '-');           
  }
  
  module.exports = generateSlug;
  