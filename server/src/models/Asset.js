const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String,
    enum: ['Laptop', 'Desktop', 'Camera', 'Printer', 'Scanner', 'Phone', 'Tablet', 'Server', 'Network Equipment', 'Office Furniture', 'Vehicle', 'Software License', 'Other'],
    required: true
  },
  brand: { type: String },
  model: { type: String },
  serialNo: { type: String, unique: true, sparse: true },
  assetTag: { type: String, unique: true },
  purchaseDate: { type: Date },
  purchasePrice: { type: Number, default: 0 },
  vendor: { type: String },
  warrantyExpiry: { type: Date },
  condition: { type: String, enum: ['New', 'Good', 'Fair', 'Poor', 'Under Repair', 'Disposed'], default: 'Good' },
  status: { type: String, enum: ['Available', 'Assigned', 'Under Repair', 'Disposed', 'Lost'], default: 'Available' },
  location: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },
  returnedAt: { type: Date },
  allocationHistory: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: Date,
    returnedAt: Date,
    notes: String,
  }],
  depreciation: {
    method: { type: String, enum: ['Straight Line', 'WDV'], default: 'Straight Line' },
    usefulLife: { type: Number, default: 5 }, // years
    currentValue: { type: Number },
  },
  specifications: { type: Map, of: String },
  images: [String],
  notes: { type: String },
}, { timestamps: true });

assetSchema.pre('validate', async function(next) {
  if (!this.assetTag) {
    const count = await mongoose.model('Asset').countDocuments();
    this.assetTag = `AST-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);
