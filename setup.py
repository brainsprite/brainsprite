from codecs import open
from setuptools import setup


with open('README.md', encoding='utf-8') as fd:
    LONG_DESCRIPTION = fd.read()

setup(
    name='brainsprite',
    long_description=LONG_DESCRIPTION,
    license='MIT',
    packages=['brainsprite'],
    package_data={
        'assets': 'assets/*',
        'examples': 'examples/*'
    },
    include_package_data=True,
    install_requires=[
        'matplotlib',
        'PILLOW',
        'numpy',
        'nibabel',
        'nilearn',
        'shutil',
        'scipy'
    ],
    classifiers=[
        'License :: OSI Approved :: MIT License',
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
    ],
)
