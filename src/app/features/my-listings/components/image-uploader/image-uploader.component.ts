import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from 'src/app/core/services/api.service';

interface ImageUpload {
  id: string;
  file?: File;
  tempId?: string;
  preview: string;
  uploading: boolean;
  progress: number;
  error?: string;
  isExisting?: boolean;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.css']
})
export class ImageUploaderComponent {
  @Input() maxImages = 5;
  @Input() maxSizeInMB = 2;
  @Input() existingImages: ImageUpload[] = [];
  @Output() imagesChanged = new EventEmitter<{
    tempIds: string[],
    existingIds: string[],
    deletedIds: string[]
  }>();

  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private apiService = inject(ApiService);

  images = signal<ImageUpload[]>([]);
  isDragging = signal(false);
  deletedImageIds: string[] = [];

  ngOnInit(): void {
    if (this.existingImages.length > 0) {
      const existingWithFlag = this.existingImages.map(img => ({
        ...img,
        isExisting: true
      }));
      this.images.set(existingWithFlag);
      this.emitChanges();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  private handleFiles(files: File[]): void {
    const currentImages = this.images();
    const remainingSlots = this.maxImages - currentImages.length;

    if (remainingSlots <= 0) {
      this.snackBar.open(`Máximo ${this.maxImages} imágenes permitidas`, 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const maxSizeBytes = this.maxSizeInMB * 1024 * 1024;

    for (const file of filesToProcess) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        this.snackBar.open(`${file.name} no es una imagen válida`, 'Cerrar', {
          duration: 3000
        });
        continue;
      }

      // Validar tamaño
      if (file.size > maxSizeBytes) {
        this.snackBar.open(
          `${file.name} supera el tamaño máximo de ${this.maxSizeInMB}MB`,
          'Cerrar',
          { duration: 3000 }
        );
        continue;
      }

      this.uploadImage(file);
    }
  }

  private uploadImage(file: File): void {
    const reader = new FileReader();
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    const newImage: ImageUpload = {
      id: tempId,
      file,
      preview: '',
      uploading: true,
      progress: 0
    };

    reader.onload = (e) => {
      newImage.preview = e.target?.result as string;
      this.images.update(imgs => [...imgs, newImage]);
      this.performUpload(newImage);
    };

    reader.readAsDataURL(file);
  }

  private performUpload(image: ImageUpload): void {
    const formData = new FormData();
    formData.append('file', image.file!);

    this.apiService.postWithOptions<{ temp_id: string }>(`/images/upload-temp`, formData, {    
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round((event.loaded / event.total) * 100);
          this.images.update(imgs => 
            imgs.map(img => 
              img.id === image.id ? { ...img, progress } : img
            )
          );
        } else if (event.type === HttpEventType.Response) {
          const tempId = event.body?.temp_id;
          if (tempId) {
            this.images.update(imgs => 
              imgs.map(img => 
                img.id === image.id 
                  ? { ...img, tempId, uploading: false, progress: 100 }
                  : img
              )
            );
            this.emitChanges();
          }
        }
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.images.update(imgs => 
          imgs.map(img => 
            img.id === image.id 
              ? { ...img, uploading: false, error: 'Error al subir imagen' }
              : img
          )
        );
        this.snackBar.open('Error al subir imagen', 'Cerrar', { duration: 3000 });
      }
    });
  }

  removeImage(image: ImageUpload): void {        
    if (image.isExisting && !image.tempId) {
      this.deletedImageIds.push(image.id);
    }
    
    this.images.update(imgs => imgs.filter(img => img.id !== image.id));
    this.emitChanges();
  }

  onImageDrop(event: CdkDragDrop<ImageUpload[]>): void {
    const currentImages = [...this.images()];
    moveItemInArray(currentImages, event.previousIndex, event.currentIndex);
    this.images.set(currentImages);
    this.emitChanges();
  }

  private emitChanges(): void {
    const tempIds = this.images()
      .filter(img => img.tempId && !img.uploading && !img.isExisting)
      .map(img => img.tempId!);
    
    const existingIds = this.images()
      .filter(img => img.isExisting && !img.tempId)
      .map(img => img.id);

    this.imagesChanged.emit({
      tempIds,
      existingIds,
      deletedIds: this.deletedImageIds
    });
  }

  get canAddMore(): boolean {
    return this.images().length < this.maxImages;
  }

  get uploadingCount(): number {
    return this.images().filter(img => img.uploading).length;
  }
}